'use client'

import { use, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Calendar as CalendarIcon, RefreshCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { usePromine } from '@/hooks/usePromise'
import { getBrands } from '@/actions/database/brands'
import { TaskContext } from '@/providers/taks'
import { useSession } from 'next-auth/react'
import { UserContext } from '@/providers/user'

const FormSchema = z.object({
  name: z.string().nonempty().trim(),
  solicitador: z.string().email(),
  url: z.string().url().optional(),
  project: z.string().min(1),
  priority: z.string().min(1),
  type: z.string(),
  endDate: z.date().optional(),
  brands: z.string().min(1),
  description: z.string().min(20).trim(),
})

export const FormSocialTask = () => {
  const { task, setTask } = use(TaskContext)
  const [event, setEvent] = useState<'SAVED' | 'COMPLET'>('SAVED')
  const { event: eventTask, handleValueChange } = use(TaskContext)
  const { data: brands } = usePromine(getBrands)
  const { data: session } = useSession()
  const { createTask } = use(TaskContext)
  const { role } = use(UserContext)

  const defaultValues = {
    name: '',
    url: '',
    solicitador: session?.user?.email as string,
    project: '13eab8f4-3aa0-808e-b7d0-f4bce3a9c307',
    priority: '13eab8f4-3aa0-813f-af46-c000e74e3b2e',
    type: 'REDES',
    brands: '',
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    description: '',
  }

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultValues,
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    // @ts-ignore
    data.brands = [data.brands]

    if (!task) {
      form.reset()
      createTask(event, data)
      return
    }
    createTask(event, data, task.id)
    form.reset(defaultValues)
    return
  }

  useEffect(() => {
    if (task?.type === 'SOCIAL') {
      if (!eventTask) {
        form.reset({
          name: task.name,
          url: task?.url || undefined,
          solicitador: task.solicitador,
          project: task.project,
          priority: task.priority,
          type: task.type,
          brands: task.brands[0].name,
          endDate: task?.endDate || undefined,
          description: task.description,
        })
      }
    }
  }, [task, form, eventTask])

  if (!brands) return

  const items = brands.map((brand) => ({
    id: brand.name,
    label: brand.name,
  }))

  const resetBlank = () => {
    form.reset(defaultValues)
    setTask(null)
  }

  const isAdmin = role === 'ADMIN'

  return (
    brands && (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          {...form}
          className='space-y-4 grid grid-cols-2 gap-x-4 px-2 w-full items-end'>
          <FormField
            control={form.control}
            name='solicitador'
            render={({ field }) => (
              <FormItem className={cn('col-span-2', !isAdmin && 'hidden')}>
                <FormLabel>Solicitador</FormLabel>
                <FormControl>
                  <Input disabled={!isAdmin} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <FormLabel>
                  Title <span className='text-destructive'>*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Url</FormLabel>
                <FormControl>
                  <Input placeholder='' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>
                  Fecha Limit <span className='text-destructive'>*</span>
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}>
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='end'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date >
                          new Date(Date.now() + 1000 * 60 * 60 * 24 * 45) ||
                        date < new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='brands'
            render={({ field }) => (
              <FormItem className='space-y-3 col-span-2'>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className='flex flex-wrap gap-4 items-center'>
                    {items.map((item) => (
                      <FormItem
                        className='flex  items-center space-x-3 space-y-0'
                        key={item.label}>
                        <FormControl>
                          <RadioGroupItem value={item.id} />
                        </FormControl>
                        <FormLabel className='font-normal capitalize'>
                          {item.label.toLowerCase()}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <FormLabel>
                  Descripción <span className='text-destructive'>*</span>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder='' className='resize-none' {...field} />
                </FormControl>
                <FormDescription>
                  Descripción detallada de los cambios a realizar.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex col-span-2 gap-2'>
            <Button
              type='button'
              size={'icon'}
              variant={'secondary'}
              onClick={() => form.reset()}>
              <RefreshCcw size={16} />
            </Button>
            {task && (
              <Button
                type='button'
                size={'icon'}
                variant={'secondary'}
                onClick={() => resetBlank()}>
                <Trash2 size={16} />
              </Button>
            )}
            {!task && (
              <Button
                type='submit'
                variant={'secondary'}
                className='min-w-32'
                onClick={() => {
                  handleValueChange('pendings')
                  setEvent('SAVED')
                }}>
                Guardar
              </Button>
            )}
            <Button
              className=' flex-1'
              type='submit'
              onClick={() => {
                handleValueChange('tasks')
                setEvent('COMPLET')
              }}
              disabled={form.formState.isSubmitting}>
              Enviar
            </Button>
          </div>
        </form>
      </Form>
    )
  )
}
